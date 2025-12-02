import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// 1. HTTP Bağlantısını Oluşturma
const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql', // Backend GraphQL endpoint'i
});

// 2. Auth Link'i Oluşturma (JWT Ekleme)
const authLink = setContext((_, { headers }) => {
  // localStorage veya Session Storage'dan token'ı al
  const token = localStorage.getItem('token'); 

  // Headers'a token'ı ekle
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// 3. Apollo Client'ı Oluşturma
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;


/*import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

const authLink = new ApolloLink((operation, forward) => {
    const token = typeof window !== 'undefined' 
        ? localStorage.getItem('accessToken') 
        : null;

    operation.setContext(({ headers = {} }) => ({
        headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        },
    }));

    return forward(operation);
});

const httpLink = new HttpLink({
    uri: 'http://localhost:3000/graphql',
});

export const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    ssrMode: typeof window === 'undefined',
});
*/
