import React from 'react';
import { Button, Table } from 'semantic-ui-react';
import { Icon, InlineIcon } from '@iconify/react';
import infinityIcon from '@iconify/icons-mdi/infinity';
import { SemanticToastContainer, toast } from 'react-semantic-toasts';
import SettingsModal from '../components/game/settingsModal';
import 'react-semantic-toasts/styles/react-semantic-alert.css';

class Game extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      game: {},
      deck: [],
      images: {}
    };
  }

  getGame = async (getDeck = false) => {
    this.setState({ isLoading: true });
    fetch('https://deck-builder-api.herokuapp.com/games/' + this.props.id)
      .then(async (response) => {
        const game = await response.json();
        if (!response.ok) {
          throw ({ title: game.statusText || '', description: game.message || '' });
        }
        if (getDeck) {
          fetch('https://deck-builder-api.herokuapp.com/deck/' + game.deck_id)
            .then(async (response) => {
              const deck = await response.json();
              if (!response.ok) {
                throw ({ title: deck.statusText || '', description: deck.message || '' });
              }
              this.setState({ game, deck, isLoading: false });
            })
            .catch((err) => {
              toast(err);
            });
        } else {
          this.setState({ game, isLoading: false });
        }
      })
      .catch((err) => {
        toast(err);
      });
  };

  getCardImages = async () => {
    fetch('https://deck-builder-api.herokuapp.com/deck/images/' + this.state.game.deck_id)
      .then(async (response) => {
        if (this.state.game.deck_id) {
          const card_images = await response.json();
          if (!response.ok) {
            throw ({ title: card_images.statusText || '', description: card_images.message || '' });
          }
          const images = card_images.reduce((acc, { id, data, modified_at }) => {
            acc[id] = { data, modified_at };
            return acc;
          }, {});
          this.setState({ images });
        }
      })
      .catch((err) => {
        toast(err);
      });
  };

  startGame = async () => {
    this.setState({ isLoading: true });
    fetch('https://deck-builder-api.herokuapp.com/games/' + this.props.id + '/start', { method: 'POST' })
      .then(async (response) => {
        const game = await response.json();
        if (!response.ok) {
          throw ({ title: game.statusText || '', description: game.message || '' });
        }
        this.setState({ game, isLoading: false });
      })
      .catch((err) => {
        toast(err);
      });
  };

  saveSettings = (settings) => {
    fetch('https://deck-builder-api.herokuapp.com/games/' + this.props.id + '/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(async (response) => {
      if (!response.ok) {
        const res = await response.json();
        throw ({ title: res.statusText || '', description: res.message || '' });
      }
      this.startGame();
    }).catch((err) => {
      toast(err);
    });
  };

  componentDidMount() {
    this.getGame(true);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.game.deck_id && prevState.game.deck_id !== this.state.game.deck_id) {
      this.getCardImages();
    }
  }

  turn_action = (action) => {
    fetch('https://deck-builder-api.herokuapp.com/games/' + this.props.id + '/player/' + action, { method: 'POST' })
      .then(async (response) => {
        const res = await response.json();
        if (!response.ok || await res !== 'OK') {
          throw ({ title: res.statusText || '', description: res.message || '' });
        } else {
          this.getGame();
        }
      })
      .catch((err) => {
        toast(err);
      });
  };

  card_action = (action, query = {}) => {
    let url = `https://deck-builder-api.herokuapp.com/games/${ this.props.id }/player/card/${ action }`;
    if (query) {
      url += `?${ Object.entries(query).map(([key, value]) => (`${ key }=${ value }`)).join('&') }`;
    }
    fetch(url, { method: 'POST' })
      .then(async (response) => {
        const res = await response.json();
        if (!response.ok || await res !== 'OK') {
          throw ({ title: response.statusText || '', description: res.message || '' });
        } else {
          this.getGame();
        }
      })
      .catch((err) => {
        toast(err);
      });
  };

  getActionButtons = (curr_player) => {
    if (curr_player.current_turn) {
      return <div>
        <Button onClick={ () => this.card_action('draw', { 'num': 1 }) }>Draw</Button>
        <Button onClick={ () => this.turn_action('end') }>End Turn</Button>
      </div>;
    }

    return (<Button onClick={ () => this.turn_action('start') }>Start Turn</Button>);
  };

  render() {
    const { game = {}, deck, images, isLoading } = this.state;
    const curr_player = game.curr_player > -1 ? game.players[game.curr_player] : {};

    if (game.game_ended) {
      return (<main>
        <SemanticToastContainer/>
        <h2>Winner: { game.game_ended.winner[0] } with { game.game_ended.winner[1] } points!</h2>
        <Table celled style={ { margin: 'auto', width: '750px' } }>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Player</Table.HeaderCell>
              <Table.HeaderCell>Points</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            { Object.entries(game.game_ended.player_points).map(([player, points]) => (<Table.Row>
              <Table.Cell>{ player }</Table.Cell>
              <Table.Cell>{ points }</Table.Cell>
            </Table.Row>)) }
          </Table.Body>
        </Table>
      </main>);
    }
    return (
      <main>
        <SemanticToastContainer/>
        { isLoading ? <div>LOADING...</div> : null }
        <SettingsModal isOpen={ deck.cards && (!game.settings || game.curr_player < 0) } deck={ deck }
                       images={ images } saveSettings={ this.saveSettings }/>
        <div>Destroyed: { (game.destroy || []).length } Cards</div>
        <div>Marketplace</div>
        <div style={ {
          display: 'flex', width: '100vw', height: '60vh',
          overflowY: 'scroll', flexWrap: 'wrap', margin: '5px',
          backgroundColor: 'lightgray'
        } }>
          { (game.marketplace || []).map(
            (card, index) => (
              <div style={ { padding: '10px', display: 'flex', flexDirection: 'column' } }>
                { images[card.id] ?
                  <img alt={ 'card' } style={ { height: '250px', marginBottom: '10px' } }
                       src={ `data:image/png;base64,${ images[card.id].data }` }/> : <div>LOADING...</div> }
                Qty: { card.qty }
                { curr_player.current_turn ?
                  <Button onClick={ () => this.card_action('buy', { index }) }>Buy</Button> :
                  null }
              </div>
            )
          ) }
        </div>

        { curr_player.name ?
          <div>
            <div>{ curr_player.name }'s Hand</div>
            <div>
              Deck: { (curr_player.deck || []).length } Cards
              -
              Discard: { (curr_player.discard || []).length } Cards
            </div>
            <div style={ { display: 'flex', flexDirection: 'row' } }>
              <div style={ { width: '20vw' } }>
                <div>Buying Power: { ((curr_player.current_turn || {}).buying_power || {}).optional }</div>
                <div>Actions Left:</div>
                <Table definition>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell/>
                      <Table.HeaderCell>Required</Table.HeaderCell>
                      <Table.HeaderCell>Optional</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    { Object.entries(curr_player.current_turn || {}).reduce((acc, [action_type, qtys]) => {
                      if (action_type !== 'buying_power') {
                        acc.push(<Table.Row>
                          <Table.Cell>{ action_type }</Table.Cell>
                          <Table.Cell>{ ((qtys.required === '-1' || qtys.required === -1) &&
                            <Icon icon={ infinityIcon }/>) || qtys.required || 0 }</Table.Cell>
                          <Table.Cell>{ ((qtys.optional === '-1' || qtys.optional === -1) &&
                            <Icon icon={ infinityIcon }/>) || qtys.optional || 0 }</Table.Cell>
                        </Table.Row>);
                      }
                      return acc;
                    }, []) }
                  </Table.Body>
                </Table>
              </div>
              <div style={ {
                display: 'flex', width: '80vw', height: '60vh',
                overflowY: 'scroll', flexWrap: 'wrap', margin: '5px',
                backgroundColor: 'lightgray'
              } }>
                { curr_player.current_turn && (curr_player.hand || []).map((card, index) => (
                  <div style={ { padding: '10px', display: 'flex', flexDirection: 'column' } }>
                    { images[card.id] ?
                      <img alt={ 'card' } style={ { height: '250px', marginBottom: '10px' } }
                           src={ `data:image/png;base64,${ images[card.id].data }` }/> : 'LOADING...' }
                    <Button disabled={ card.played } onClick={ () => this.card_action('play', { index }) }>
                      { card.played ? 'Played' : 'Play' }
                    </Button>
                    <div className={ 'row' }>
                      <Button disabled={ card.played }
                              onClick={ () => this.card_action('discard', { index }) }>Discard</Button>
                      <Button disabled={ card.played }
                              onClick={ () => this.card_action('destroy', { index }) }>Destroy</Button>
                    </div>
                  </div>
                )) }
              </div>
            </div>
            <div className={ 'row' } style={ { marginBottom: '10px' } }>
              { this.getActionButtons(curr_player) }
            </div>
          </div> : null }
      </main>
    );
  }
}

export default Game;
