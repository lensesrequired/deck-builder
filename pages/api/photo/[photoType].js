import artFiles from '/public/cards';

export default handler = (req, res) => {
  const {
    query: { photoType },
    method
  } = req;

  switch (method) {
    case 'POST':
      res.send(artFiles[photoType] || []);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${ method } Not Allowed`);
  }
};
