import React from 'react';
import { v1 as uuid } from 'uuid';
import { Button, Table } from 'semantic-ui-react';
import { Icon, InlineIcon } from '@iconify/react';
import infinityIcon from '@iconify/icons-mdi/infinity';
import { SemanticToastContainer, toast } from 'react-semantic-toasts';
import SettingsModal from '../components/game/settingsModal';

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
    if (this.props.id) {
      fetch('/api/game/' + this.props.id)
        .then(async (response) => {
          const game = await response.json();
          if (!response.ok) {
            throw ({ title: game.statusText || '', description: game.message || '' });
          }
          if (getDeck) {
            fetch('/api/deck/' + game.deckId)
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
    }
  };

  getCardImages = async () => {
    fetch('/api/deck/' + this.state.game.deckId).then(async (response) => {
      if (response.ok) {
        const { cards } = await response.json();
        fetch('https://deck-builder-api.herokuapp.com/deck/images/' + uuid(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cards)
        })
          .then(async (response) => {
            if (this.state.game.deckId) {
              const cardImages = await response.json();
              if (!response.ok) {
                throw ({ title: cardImages.statusText || '', description: cardImages.message || '' });
              }
              const images = cardImages.reduce((acc, { _id, data, modifiedAt }) => {
                acc[_id] = { data, modifiedAt };
                return acc;
              }, {});
              this.setState({ images });
            }
          })
          .catch((err) => {
            toast(err);
          });
      }
    });
  };

  startGame = async () => {
    this.setState({ isLoading: true });
    fetch('/api/game/' + this.props.id + '/start', { method: 'POST' })
      .then(async (response) => {
        const game = await response.json();
        if (!response.ok) {
          throw ({ title: game.statusText || '', description: game.message || '' });
        }
        this.setState({ game, isLoading: false }, () => {
          this.turnAction('start');
        });
      })
      .catch((err) => {
        toast(err);
      });
  };

  saveSettings = ({ marketplace, ...settings }) => {
    fetch('/api/game/' + this.props.id, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, marketplace })
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
    if (this.state.game.deckId && prevState.game.deckId !== this.state.game.deckId) {
      this.getCardImages();
    }
  }

  turnAction = (action) => {
    fetch('/api/game/' + this.props.id + '/player/' + action, { method: 'POST' })
      .then(async (response) => {
        const res = await response.json();
        if (!response.ok || res.errors) {
          throw ({ title: res.statusText || '', description: res.message || '' });
        } else {
          this.setState({ game: res });
        }
      })
      .catch((err) => {
        toast(err);
      });
  };

  cardAction = (action, query = {}) => {
    let url = `/api/game/${ this.props.id }/player/card/${ action }`;
    if (query) {
      url += `?${ Object.entries(query).map(([key, value]) => (`${ key }=${ value }`)).join('&') }`;
    }
    fetch(url, { method: 'POST' })
      .then(async (response) => {
        const res = await response.json();
        if (!response.ok || res.errors) {
          throw ({ title: response.statusText || '', description: res.message || '' });
        } else {
          this.setState({ game: res });
        }
      })
      .catch((err) => {
        toast(err);
      });
  };

  getActionButtons = (currentPlayer) => {
    if (currentPlayer.currentTurn) {
      return <div>
        <Button onClick={ () => this.cardAction('draw', { 'num': 1 }) }>Draw</Button>
        <Button onClick={ () => this.turnAction('end') }>End Turn</Button>
      </div>;
    }

    return (<Button onClick={ () => this.turnAction('start') }>Start Turn</Button>);
  };

  render() {
    const { game = {}, deck, images, isLoading } = this.state;
    const currentPlayer = game.currentPlayer > -1 ? game.players[game.currentPlayer] : {};

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
        <SettingsModal isOpen={ deck.cards && (!game.settings || game.currentPlayer < 0) } deck={ deck }
                       images={ images } saveSettings={ this.saveSettings }/>
        <div>Destroyed: { ((game.destroy || []).length) || '0' } Cards</div>
        <div>Marketplace</div>
        <div style={ {
          display: 'flex', width: '100vw', height: '60vh',
          overflowY: 'scroll', flexWrap: 'wrap', margin: '5px',
          backgroundColor: 'lightgray'
        } }>
          { ((game.marketplace || {}).cards || []).map(
            (card, index) => (
              <div style={ { padding: '10px', display: 'flex', flexDirection: 'column' } }>
                { images[card._id] ?
                  <img alt={ 'card' } style={ { height: '250px', marginBottom: '10px' } }
                       src={ `data:image/png;base64,${ images[card._id].data }` }/> :
                  <div>LOADING { card.name }...</div> }
                Qty: { card.qty }
                { currentPlayer.currentTurn ?
                  <Button onClick={ () => this.cardAction('buy', { index }) }>Buy</Button> :
                  null }
              </div>
            )
          ) }
        </div>

        { currentPlayer.name ?
          <div>
            <div>{ currentPlayer.name }'s Hand</div>
            <div>
              Deck: { (currentPlayer.deck || []).length } Cards
              -
              Discard: { (currentPlayer.discard || []).length } Cards
            </div>
            <div style={ { display: 'flex', flexDirection: 'row' } }>
              <div style={ { width: '20vw' } }>
                <div>Buying Power: { ((currentPlayer.currentTurn || {}).buying_power || {}).optional }</div>
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
                    { Object.entries(currentPlayer.currentTurn || {}).reduce((acc, [actionType, qtys]) => {
                      if (actionType !== 'buying_power') {
                        acc.push(<Table.Row>
                          <Table.Cell>{ actionType }</Table.Cell>
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
                { currentPlayer.currentTurn && ((currentPlayer.hand || {}).cards || []).map((card, index) => (
                  <div style={ { padding: '10px', display: 'flex', flexDirection: 'column' } }>
                    { images[card._id] ?
                      <img alt={ 'card' } style={ { height: '250px', marginBottom: '10px' } }
                           src={ `data:image/png;base64,${ images[card._id].data }` }/> :
                      <div>LOADING { card.name }..</div> }
                    <Button disabled={ card.played } onClick={ () => this.cardAction('play', { index }) }>
                      { card.played ? 'Played' : 'Play' }
                    </Button>
                    <div className={ 'row' }>
                      <Button disabled={ card.played }
                              onClick={ () => this.cardAction('discard', { index }) }>Discard</Button>
                      <Button disabled={ card.played }
                              onClick={ () => this.cardAction('destroy', { index }) }>Destroy</Button>
                    </div>
                  </div>
                )) }
              </div>
            </div>
            <div className={ 'row' } style={ { marginBottom: '10px' } }>
              { this.getActionButtons(currentPlayer) }
            </div>
          </div> : null }
      </main>
    );
  }
}

Game.getInitialProps = ({ query: { id } = {} }) => {
  return { id };
};
export default Game;
