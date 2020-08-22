import React from 'react';
import { v1 as uuid } from 'uuid';
import { Input, Button } from 'semantic-ui-react';
import CardModal from '../components/creator/cardModal';

class Creator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isDownloading: false,
      isModalOpen: false,
      cardImages: {},
      cards: [],
      editCard: {},
      editCardIndex: -1
    };
    this.fileInputRef = React.createRef();
  }

  getCardImages = async (cards) => {
    const { cardImages } = this.state;
    let url = 'https://deck-builder-api.herokuapp.com/deck/images/' + uuid();
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cards)
    }).then(async (response) => {
      console.log(response);
      const images = await response.json();
      console.log(images);
      if (response.ok) {
        images.forEach(({ _id, data, modifiedAt }) => {
          cardImages[_id] = { data, modifiedAt };
        });
      } else {
        // TODO: Show error
      }

      this.setState({ cardImages });
    });
  };

  getCards = async () => {
    const { cardImages } = this.state;
    this.setState({ isLoading: true });
    fetch('/api/deck/' + this.props.id)
      .then(async (response) => {
        if (response.ok) {
          const deck = await response.json();
          const { cards } = deck;
          this.setState({ cards, isLoading: false });
        } else {
          // TODO: Handle error
          this.setState({ isLoading: false });
        }
      });
  };

  updateCards = async (cards, reload = true) => {
    fetch('/api/deck/' + this.props.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: JSON.parse(JSON.stringify(cards)).map((c) => {
          delete c.image;
          return c;
        })
      })
    }).then((response) => {
      if (reload) {
        this.getCards();
      } else {
        this.setState({ cards });
      }
    });
  };

  addCard = async (card, actions) => {
    const { cards } = this.state;
    const newCard = {
      ...card,
      modifiedAt: new Date(),
      actions: Object.entries(actions).reduce((acc, [type, { qty, required }]) => {
        if (qty && qty !== '0') {
          acc.push({ type, qty, required });
        }
        return acc;
      }, [])
    };
    this.state.editCardIndex > -1 ?
      cards.splice(this.state.editCardIndex, 1, newCard) :
      cards.push(newCard);
    this.updateCards(cards);
    this.setState({ isModalOpen: false });
  };

  downloadCards = () => {
    this.setState({ isDownloading: true });
    const { cards } = JSON.parse(JSON.stringify(this.state));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(cards.map((c) => {
        delete c._id;
        delete c.modifiedAt;
        return c;
      }))
    );
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'deck.json');
    dlAnchorElem.click();
    this.setState({ isDownloading: false });
  };

  exportPDF = () => {
    this.setState({ isDownloading: true });
    fetch(`https://deck-builder-api.herokuapp.com/deck/pdf/${ uuid() }`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.state.cards)
    })
      .then(async (response) => {
        const downloadPDF = (data) => {
          const dlAnchorElem = document.createElement('a');
          dlAnchorElem.setAttribute('href', `${ data }`);
          dlAnchorElem.setAttribute('download', 'deck.pdf');
          dlAnchorElem.click();
          this.setState({ isDownloading: false });
        };

        let reader = new FileReader();
        reader.readAsDataURL(await response.blob());
        reader.onloadend = function() {
          let base64data = reader.result;
          downloadPDF(base64data);
        };
      });
  };

  createGame = () => {
    this.setState({ isDownloading: true });
    fetch(`/game/create/${ this.props.id }`, { method: 'POST' })
      .then(async (response) => {
        const gameId = await response.json();
        window.location = '/game?id=' + gameId;
      });
  };

  updateQty = (index, value) => {
    const { cards } = this.state;
    const card = cards[index];
    card.qty = value ? value : '0';
    cards.splice(index, 1, card);
    this.updateCards(cards, false);
  };

  removeCard = (index) => {
    const { cards } = this.state;
    cards.splice(index, 1);
    this.updateCards(cards);
  };

  openCardModal = (index = -1) => {
    const { cards } = this.state;
    this.setState({
      isModalOpen: true, editCardIndex: index,
      editCard: index < 0 ? {} : JSON.parse(JSON.stringify(cards[index]))
    });
  };

  fileChange = ({ target }) => {
    const { cards } = this.state;
    let reader = new FileReader();
    const setCards = (c) => this.updateCards(c);
    reader.onload = function onReaderLoad(event) {
      let obj = JSON.parse(event.target.result);
      if (Array.isArray(obj)) {
        setCards([
          ...cards, ...(obj.map((card) => {
            card.modifiedAt = new Date();
            return card;
          }))]);
      } else {
        // TODO: Show error
      }
    };
    reader.readAsText(target.files[0]);
  };

  //5f413ce5fbbd4f58512549e0
  componentDidMount(prevProps, prevState, snapshot) {
    if (this.props.id) {
      return this.getCards();
    }
    fetch('/api/deck', { method: 'POST' })
      .then(async (response) => {
        const deck = await response.json();
        this.props.setId(deck._id);
      });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.id !== prevProps.id) {
      return this.getCards();
    }
    if (this.state.cards !== prevState.cards) {
      const { cardImages } = this.state;
      const newImages = [];
      this.state.cards.forEach((card) => {
        const { _id, modifiedAt } = card;
        if (!cardImages[_id] || Math.abs(new Date(cardImages[_id].modifiedAt) - new Date(modifiedAt)) > 1000) {
          cardImages[_id] = {};
          newImages.push(card);
        }
      });
      this.setState({ cardImages }, () => {
        this.getCardImages(newImages);
      });
    }
  }

  render() {
    const { isLoading, isDownloading, isModalOpen, editCard, cards, cardImages } = this.state;
    return (
      <main>
        <h1>Build a Deck</h1>
        <CardModal isOpen={ isModalOpen } card={ editCard } onSave={ this.addCard }
                   onClose={ () => this.setState({ isModalOpen: false }) }/>
        <div className={ 'row' }>
          <Button content={ 'Upload Cards' } onClick={ () => this.fileInputRef.current.click() }/>
          <input ref={ this.fileInputRef } type="file" hidden onChange={ this.fileChange }/>
          <Button onClick={ () => this.openCardModal() }>Add a Card</Button>
          <Button>
            <a href={ `${ process.env.PUBLIC_URL }/deck_template.json` } download={ `deck_template.json` }>
              Download Template</a>
          </Button>
        </div>
        <div style={ {
          display: 'flex', width: '100vw', height: '80vh',
          overflowY: 'scroll', flexWrap: 'wrap', margin: '5px',
          backgroundColor: 'lightgray'
        } }>
          { isLoading ? <p>{ 'LOADING' }</p> : (cards || []).map(
            (card, index) => (
              <div style={ { padding: '10px', display: 'flex', flexDirection: 'column' } }>
                { (cardImages[card._id] || {}).data ?
                  <img alt={ 'card' } style={ { height: '400px', marginBottom: '10px' } }
                       src={ `data:image/png;base64,${ cardImages[card._id].data }` }/> : 'Loading...' }
                <Input label={ 'Qty' } style={ { marginBottom: '3px' } } type={ 'number' }
                       value={ card.qty === '0' ? '' : card.qty }
                       onChange={ (_, { value }) => this.updateQty(index, value) }/>
                <div className={ 'row' }>
                  <Button onClick={ () => this.openCardModal(index) }>Edit</Button>
                  <Button onClick={ () => this.removeCard(index) }>Remove</Button>
                </div>
              </div>
            )
          ) }
        </div>
        <div className={ 'row' }>
          <Button onClick={ this.exportPDF }>{ isDownloading ? 'Exporting...' : 'Export Cards as PDF' }</Button>
          <Button onClick={ this.downloadCards }>{ isDownloading ? 'Exporting...' : 'Export Cards as JSON' }</Button>
          <Button onClick={ this.createGame }>Play Game!</Button>
        </div>
      </main>
    );
  }
}

Creator.getInitialProps = ({ query: { id } = {} }) => {
  return { id };
};
export default Creator;
