import React from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import 'semantic-ui-css/semantic.min.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const { query } = router;
  const id = query.id || '';

  const setId = (id) => {
    console.log(id);
    router.push(`/?id=${ id }`);
  };

  pageProps = {
    ...pageProps, id, setId
  };

  return <Component { ...pageProps } />;
}

export default MyApp;
