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

  getCardImage = async (id) => {
    const { cardImages } = this.state;
    let url = 'https://deck-builder-api.herokuapp.com/deck/images/' + this.props.id;
    if (id) {
      url += `?card_id=${ id }`;
    }
    fetch(url)
      .then(async (response) => {
        const images = await response.json();
        images.forEach(({ id, data, modified_at }) => {
          cardImages[id] = { data, modified_at };
        });

        this.setState({ cardImages });
      });
  };

  getCards = async (getImages = false) => {
    const { cardImages } = this.state;
    this.setState({ isLoading: true });
    fetch('https://deck-builder-api.herokuapp.com/deck/' + this.props.id)
      .then(async (response) => {
        const deck = await response.json();
        const { cards } = deck;
        if (getImages) {
          cards.forEach(({ id, modified_at }) => {
            if (!cardImages[id] || Math.abs(new Date(cardImages[id].modified_at) - new Date(modified_at)) > 1000) {
              cardImages[id] = {};
              this.getCardImage(id);
            }
          });
        }

        this.setState({ cards, cardImages, isLoading: false });
      });
  };

  updateCards = async (cards, reload = true) => {
    fetch('https://deck-builder-api.herokuapp.com/cards/' + this.props.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.parse(JSON.stringify(cards)).map((c) => {
        delete c.image;
        return c;
      }))
    }).then(() => {
      if (reload) {
        this.getCards(true);
      } else {
        this.setState({ cards });
      }
    });
  };

  addCard = async (card, actions) => {
    const { cards } = this.state;
    const newCard = {
      ...card,
      modified_at: new Date(),
      actions: Object.entries(actions).reduce((acc, [type, { qty, required }]) => {
        if (qty && qty !== '0') {
          acc.push({ type, qty, required });
        }
        return acc;
      }, [])
    };
    this.state.editCardIndex > -1 ?
      cards.splice(this.state.editCardIndex, 1, newCard) :
      cards.push({ id: uuid(), ...newCard });
    this.updateCards(cards);
    this.setState({ isModalOpen: false });
  };

  downloadCards = () => {
    this.setState({ isDownloading: true });
    const { cards } = JSON.parse(JSON.stringify(this.state));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(cards.map((c) => {
        delete c.id;
        delete c.modified_at;
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
    fetch(`https://deck-builder-api.herokuapp.com/deck/${ this.props.id }/pdf/${ uuid() }`)
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
    fetch(`https://deck-builder-api.herokuapp.com/games/create/${ this.props.id }`, { method: 'POST' })
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
            card.id = uuid();
            card.modified_at = new Date();
            return card;
          }))]);
      } else {
        // TODO: Show error
      }
    };
    reader.readAsText(target.files[0]);
  };

  componentDidMount(prevProps, prevState, snapshot) {
    if (this.props.id) {
      return [this.getCards(), this.getCardImage()];
    }

    fetch('https://deck-builder-api.herokuapp.com/deck', { method: 'POST' })
      .then(async (response) => {
        const deckId = await response.json();
        this.props.setId(deckId);
      });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.id !== prevProps.id) {
      return [this.getCards(), this.getCardImage()];
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
                { (cardImages[card.id] || {}).data ?
                  <img alt={ 'card' } style={ { height: '400px', marginBottom: '10px' } }
                       src={ `data:image/png;base64,${ cardImages[card.id].data }` }/> : 'Loading...' }
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

export default Creator;
