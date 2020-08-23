import React from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import 'semantic-ui-css/semantic.min.css';
import 'react-semantic-toasts/styles/react-semantic-alert.css';

function MyApp({ Component, pageProps, props }) {
  const router = useRouter();

  const setId = (id) => {
    router.push(`/?id=${ id }`);
  };

  return <Component { ...pageProps } setId={ setId }/>;
}

export default MyApp;
