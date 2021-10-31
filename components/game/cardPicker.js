import React from 'react';
import { Modal, Form, Button, Input } from 'semantic-ui-react';

class CardPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedCards: {}
    };
  }

  selectCard = (cardId, qty) => {
    const { selectedCards } = this.state;
    selectedCards[cardId] = qty;
    this.setState({ selectedCards });
  };

  render() {
    const { selectedCards } = this.state;
    const { onSave, cards = [], images = {}, deckName } = this.props;
    return (
      <Modal as={ Form } trigger={ this.props.trigger } centered={ false } open={ this.props.isOpen }>
        <Modal.Header>{ 'Select Cards' }</Modal.Header>
        <Modal.Content>
          <div style={ {
            display: 'flex', flexWrap: 'wrap', margin: '5px'
          } }>
            { cards.map((card) => (
              <div style={ { margin: '10px', display: 'flex', flexDirection: 'column' } }>
                { images[card._id] ?
                  <img alt={ 'card' } style={ { height: '300px', marginBottom: '10px' } }
                       src={ `data:image/png;base64,${ images[card._id].data }` }/> : `LOADING ${ card.name }...` }
                <div>
                  <Input type='number' label='Qty' value={ selectedCards[card._id] || '' }
                         onChange={ (_, { value }) => this.selectCard(card._id, value) }/>
                </div>
              </div>
            )) }
          </div>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' onClick={ () => onSave(cards, selectedCards, deckName) }>Save</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default CardPicker;
