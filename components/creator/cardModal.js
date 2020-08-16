import React from 'react';
import { Modal, Form, Input, Button } from 'semantic-ui-react';
import ArtModal from './artModal';

const DEFAULT_CARD = {
  'qty': 1,
  'art': '',
  'name': '',
  'actions': [],
  'costBuy': 0,
  'victoryPoints': 0,
  'buyingPower': 0
};

class CardModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      actions: {
        draw: { qty: 0, required: true },
        action: { qty: 0, required: true },
        buy: { qty: 0, required: true },
        discard: { qty: 0, required: true },
        destroy: { qty: 0, required: true }
      },
      card: JSON.parse(JSON.stringify(DEFAULT_CARD))
    };
  }

  selectArt = (photoType, artName) => {
    this.setState({ card: { ...this.state.card, art: `${ photoType }/${ artName }` } });
  };

  onInput = (event, { name, value }) => {
    this.setState({ card: { ...this.state.card, [name]: value } });
  };

  onActionChange = (event, { name, value }) => {
    this.setState({ actions: { ...this.state.actions, [name]: { ...this.state.actions[name], qty: value } } });
  };

  flipAction = (event, { name }) => {
    this.setState({
      actions: {
        ...this.state.actions,
        [name]: { ...this.state.actions[name], required: !(this.state.actions[name] || { required: true }).required }
      }
    });
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.isOpen && !prevProps.isOpen) {
      const { card } = this.props;
      const editMode = !!card.name;
      this.setState({
        card: editMode ? card : JSON.parse(JSON.stringify(DEFAULT_CARD)), editMode,
        actions: {
          draw: { qty: 0, required: true },
          action: { qty: 0, required: true },
          buy: { qty: 0, required: true },
          discard: { qty: 0, required: true },
          destroy: { qty: 0, required: true },
          ...(card.actions || []).reduce((acc, { type, qty, required }) => {
            acc[type] = { qty, required };
            return acc;
          }, {})
        }
      });
    }
  }

  render() {
    const { isOpen, onClose, onSave } = this.props;
    const { editMode, card, actions } = this.state;
    const {
      draw = { qty: 0, required: true },
      action = { qty: 0, required: true },
      buy = { qty: 0, required: true },
      discard = { qty: 0, required: true },
      destroy = { qty: 0, required: true }
    } = actions;

    return (
      <Modal as={ Form } open={ isOpen } onClose={ onClose } centered={ false }>
        <Modal.Header>{ editMode ? 'Edit Card' : 'Add Card' }</Modal.Header>
        <Modal.Content image>
          <ArtModal art={ card.art } select={ this.selectArt }/>
          <Modal.Description>
            <Form.Group>
              <Form.Input label={ 'Name' } name={ 'name' } value={ card.name || '' } onChange={ this.onInput }/>
              <Form.Input label={ 'Qty' } name={ 'qty' } type={ 'number' } value={ card.qty }
                          onChange={ this.onInput }/>
            </Form.Group>
            <Form.Group>
              <Form.Input label={ 'Cost' } name={ 'costBuy' } type={ 'number' } value={ card.costBuy || '' }
                          onChange={ this.onInput }/>
              <Form.Input label={ 'Points' } name={ 'victoryPoints' } type={ 'number' }
                          value={ card.victoryPoints || '' } onChange={ this.onInput }/>
              <Form.Input label={ 'Buying Power' } name={ 'buyingPower' } type={ 'number' }
                          value={ card.buyingPower || '' } onChange={ this.onInput }/>
            </Form.Group>
            <Form.Field>
              <label>Actions</label>
              <Form.Group style={ { paddingLeft: '25px' } }>
                <Input label={ 'Draws' } type={ 'number' } name={ 'draw' } value={ draw.qty || '' }
                       style={ { padding: '5px 0' } } onChange={ this.onActionChange }/>
                <Form.Checkbox label={ 'Required' } name={ 'draw' } checked={ draw.required }
                               style={ { paddingTop: '25px' } } onChange={ this.flipAction }/>
              </Form.Group>
              <Form.Group style={ { paddingLeft: '25px' } }>
                <Input label={ 'Actions' } type={ 'number' } name={ 'action' } value={ action.qty || '' }
                       style={ { padding: '5px 0' } } onChange={ this.onActionChange }/>
                <Form.Checkbox label={ 'Required' } name={ 'action' } checked={ action.required }
                               style={ { paddingTop: '25px' } } onChange={ this.flipAction }/>
              </Form.Group>
              <Form.Group style={ { paddingLeft: '25px' } }>
                <Input label={ 'Buys' } type={ 'number' } name={ 'buy' } value={ buy.qty || '' }
                       style={ { padding: '5px 0' } } onChange={ this.onActionChange }/>
                <Form.Checkbox label={ 'Required' } name={ 'buy' } checked={ buy.required }
                               style={ { paddingTop: '25px' } } onChange={ this.flipAction }/>
              </Form.Group>
              <Form.Group style={ { paddingLeft: '25px' } }>
                <Input label={ 'Discards' } type={ 'number' } name={ 'discard' } value={ discard.qty || '' }
                       style={ { padding: '5px 0' } } onChange={ this.onActionChange }/>
                <Form.Checkbox label={ 'Required' } name={ 'discard' } checked={ discard.required }
                               style={ { paddingTop: '25px' } } onChange={ this.flipAction }/>
              </Form.Group>
              <Form.Group style={ { paddingLeft: '25px' } }>
                <Input label={ 'Destroys' } type={ 'number' } name={ 'destroy' } value={ destroy.qty || '' }
                       style={ { padding: '5px 0' } } onChange={ this.onActionChange }/>
                <Form.Checkbox label={ 'Required' } name={ 'destroy' } checked={ destroy.required }
                               style={ { paddingTop: '25px' } } onChange={ this.flipAction }/>
              </Form.Group>
            </Form.Field>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button basic color='red' onClick={ onClose }>Cancel</Button>
          <Button color='green' onClick={ () => onSave(card, actions) }>Save</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default CardModal;
