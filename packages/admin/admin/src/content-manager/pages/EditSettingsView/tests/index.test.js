import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import EditSettingsView from '../index';
import cmReducers from '../../../../reducers';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  // eslint-disable-next-line
  CheckPermissions: ({ children }) => <div>{children}</div>,
  useNotification: jest.fn(),
}));

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const makeApp = (history, layout) => {
  const mainLayout = {
    attributes: {
      id: { type: 'integer' },
      postal_code: { type: 'integer' },
    },
    kind: 'collectionType',
    layouts: {
      edit: [
        [
          { name: 'postal_code', size: 6 },
          { name: 'city', size: 6 },
        ],
      ],
      list: ['postal_code', 'categories'],
    },
    metadatas: {
      postal_code: { edit: {}, list: { label: 'postal_code' } },
    },
    settings: { mainField: 'postal_code' },
    options: {},
    info: {
      description: 'the address',
      displayName: 'address',
      label: 'address',
      name: 'address',
    },
  };
  const components = {
    compo1: { uid: 'compo1' },
  };

  const rootReducer = combineReducers(cmReducers);
  const store = createStore(rootReducer, {
    'content-manager_app': {
      fieldSizes: {},
    },
  });

  return (
    <Router history={history}>
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <IntlProvider messages={{ en: {} }} textComponent="span" locale="en">
            <ThemeProvider theme={lightTheme}>
              <DndProvider backend={HTML5Backend}>
                <EditSettingsView
                  mainLayout={layout || mainLayout}
                  components={components}
                  isContentTypeView
                  slug="api::address.address"
                />
              </DndProvider>
            </ThemeProvider>
          </IntlProvider>
        </QueryClientProvider>
      </Provider>
    </Router>
  );
};

describe('EditSettingsView', () => {
  it('renders and matches the snapshot', async () => {
    const history = createMemoryHistory();

    const { container } = render(makeApp(history));
    await waitFor(() =>
      expect(screen.getByText('Configure the view - Address')).toBeInTheDocument()
    );

    expect(container).toMatchSnapshot();
  });

  it('should add field', async () => {
    const history = createMemoryHistory();

    const { container } = render(makeApp(history));

    await waitFor(() =>
      expect(screen.getByText('Configure the view - Address')).toBeInTheDocument()
    );

    fireEvent.mouseDown(screen.getByTestId('add-field'));

    await waitFor(() => expect(screen.getByText('city')).toBeInTheDocument());

    fireEvent.mouseDown(screen.getByText('city'));
    fireEvent.mouseDown(screen.getByTestId('add-field'));

    expect(container).toMatchSnapshot();
  });

  it('should delete field', async () => {
    const history = createMemoryHistory();
    const oneFieldLayout = {
      attributes: {
        postal_code: { type: 'integer' },
      },
      kind: 'collectionType',
      layouts: {
        edit: [[{ name: 'postal_code', size: 6 }]],
        list: ['postal_code'],
      },
      metadatas: {
        postal_code: { edit: {}, list: { label: 'postal_code' } },
      },
      settings: { mainField: 'postal_code' },
      options: {},
      info: {
        description: 'the address',
        displayName: 'address',
        label: 'address',
        name: 'address',
      },
    };

    const { queryByTestId } = render(makeApp(history, oneFieldLayout));
    await waitFor(() =>
      expect(screen.getByText('Configure the view - Address')).toBeInTheDocument()
    );

    expect(queryByTestId('delete-field')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('delete-field'));

    expect(queryByTestId('delete-field')).not.toBeInTheDocument();
  });
});
