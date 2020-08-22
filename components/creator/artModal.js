import React from 'react';
import { Modal, Image, Dimmer, Icon, Dropdown, Grid, Pagination } from 'semantic-ui-react';

const NUM_PER_ROW = 5;
const ROWS_PER_PAGE = 3;

class ArtModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 1,
      isLoading: false,
      photoType: 'none',
      artNames: []
    };
  }

  photoTypes = [
    { key: 'characters', text: 'Characters', value: 'characters' },
    { key: 'items', text: 'Items', value: 'items' },
    { key: 'places', text: 'Places', value: 'places' }
  ];

  onType = (_, data) => {
    this.setState({ photoType: data.value, page: 1 });
  };

  changePage = (_, data) => {
    this.setState({ page: data.activePage });
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.photoType !== this.state.photoType) {
      this.setState({ isLoading: true });
      fetch('/api/photo/' + this.state.photoType)
        .then(async (response) => {
          this.setState({ artNames: await response.json(), isLoading: false });
        });
    }
  }

  render() {
    const { art, select } = this.props;
    const { photoType, artNames, isLoading, page } = this.state;
    const numRows = Math.ceil(artNames.length / NUM_PER_ROW) > ROWS_PER_PAGE ?
      ROWS_PER_PAGE :
      Math.ceil(artNames.length / NUM_PER_ROW);

    return (
      <Modal size='small' centered closeIcon={ <Icon name={ 'close' }/> }
             trigger={
               <Image wrapped bordered size='medium'
                      dimmer={ <Dimmer active inverted><Icon size='big' name='edit'/></Dimmer> }
                      src={ `https://deck-builder-cards.now.sh/${ art || 'blank.png' }` }/> }>
        <Modal.Header>Art Selection</Modal.Header>
        <Modal.Content>
          <Dropdown placeholder='Photo Type' fluid selection options={ this.photoTypes } onChange={ this.onType }/>
          { isLoading ? 'LOADING' : null }
          {
            artNames.length ? <>
              <Grid>{
                Array(numRows).fill(0).map((_, rowIndex) => {
                  const startIndex = ((page - 1) * ROWS_PER_PAGE * NUM_PER_ROW) + (NUM_PER_ROW * rowIndex);
                  return (
                    <Grid.Row columns={ NUM_PER_ROW }>
                      { artNames.slice(startIndex, startIndex + NUM_PER_ROW).map((artName) => (
                        <Grid.Column>
                          <Image size={ 'large' } onClick={ () => select(photoType, artName) }
                                 src={ `https://deck-builder-cards.now.sh/${ photoType }/${ artName }` }/>
                        </Grid.Column>
                      )) }
                    </Grid.Row>
                  );
                })
              }</Grid>
              <Pagination activePage={ page } totalPages={ Math.ceil(artNames.length / (ROWS_PER_PAGE * NUM_PER_ROW)) }
                          onPageChange={ this.changePage }/>
            </> : null
          }
        </Modal.Content>
      </Modal>
    );
  }
}

export default ArtModal;
