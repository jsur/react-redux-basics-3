import React from 'react';
import { createStore, combineReducers } from 'redux';
import uuid from 'uuid';

/*

REDUCER COMPOSITION:

This is how sub-reducers work in tandem with the top-level reducer. 
The top-level reducer ( reducer() ) breaks up each part of the state tree and 
delegates the management of those pieces of state to the appropriate reducer.

WHY?

Makes it easier to handle complexity in a growing app.
As new pieces of state get added, the same pattern is applied to each one.

*/

// reducer initially gets a blank object as state, as individual reducers will
// initialize their own pieces of state
const reducer = combineReducers({
  activeThreadId: activeThreadIdReducer,
  threads: threadsReducer
});

const store = createStore(reducer);

function activeThreadIdReducer(state = '1-fca2', action) {
  if (action.type === 'OPEN_THREAD') {
    return action.id;
  } else {
    return state;
  }
}

function findThreadIndex(threads, action) {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      return threads.findIndex(
        t => t.id === action.threadId
      );
    }
    case 'DELETE_MESSAGE': {
      return threads.findIndex(
        t => t.messages.find((m) => (
          m.id === action.id
        ))
      );
    }
  }
}

function threadsReducer(state = [
    {
      id: '1-fca2',
      title: 'Buzz Aldrin',
      messages: messagesReducer(undefined, {})
    },
    {
      id: '2-be91',
      title: 'Michael Collins',
      messages: messagesReducer(undefined, {})
    },
  ], action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
    case 'DELETE_MESSAGE': {
      const threadIndex = findThreadIndex(state, action);

      const oldThread = state[threadIndex];
      const newThread = {
        ...oldThread,
        messages: messagesReducer(oldThread.messages, action)
      };

      return [
        ...state.slice(0, threadIndex),
        newThread,
        ...state.slice(
          threadIndex + 1, state.length
        )
      ];
    }
    default: {
      return state;
    }
  }
}

function messagesReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const newMessage = {
        text: action.text,
        timestamp: Date.now(),
        id: uuid.v4()
      };
      return state.concat(newMessage);
    }
    case 'DELETE_MESSAGE': {
      return state.filter(m => m.id !== action.id);
    }
    default: {
      return state;
    }
  }
}

const App = () => (
  <div className='ui segment'>
    <ThreadTabs />
    <ThreadDisplay />
  </div>
);

// a stateless functional component here!
// does not extend React.Component
const Tabs = (props) => (
  <div className='ui top attached tabular menu'>
    {
      props.tabs.map((tab, index) => (
        <div
          key={index}
          className={tab.active ? 'active item' : 'item'}
          onClick={() => props.onClick(tab.id)}
        >
          {tab.title}
        </div>
      ))
    }
  </div>
);

class ThreadTabs extends React.Component {

  // The container component, ThreadTabs connects with the store
  componentDidMount() {
    store.subscribe(() => this.forceUpdate());
  }

  /*
    Container component also specifies which presentational component
    to render
  */
  render() {
    const state = store.getState();

    const tabs = state.threads.map(t => (
      {
        title: t.title,
        active: t.id === state.activeThreadId,
        id: t.id
      }
    ));

    // The presentational component simply renders an element.
    return (
      <Tabs 
        tabs={tabs}
        onClick={(id) => (
          store.dispatch({
            type: 'OPEN_THREAD',
            id
          })
        )}
      />
    )
  }
}

class TextFieldSubmit extends React.Component {
  state = {
    value: '',
  };

  onChange = (e) => {
    this.setState({
      value: e.target.value,
    })
  };

  handleSubmit = () => {
    this.props.onSubmit(this.state.value);
    this.setState({
      value: '',
    });
  };

  render() {
    return (
      <div className='ui input'>
        <input
          onChange={this.onChange}
          value={this.state.value}
          type='text'
        />
        <button
          onClick={this.handleSubmit}
          className='ui primary button'
          type='submit'
        >
          Submit
        </button>
       </div>
    );
  }
}

const MessageList = (props) => (
  <div className='ui comments'>
    {
      props.messages.map((m, index) => (
        <div
          className='comment'
          key={index}
          onClick={() => props.onClick(m.id)}
        >
          <div className='text'>
            {m.text}
            <span className='metadata'>@{m.timestamp}</span>
          </div>
        </div>
      ))
    }
  </div>
);

const Thread = (props) => (
  <div className='ui center aligned basic segment'>
    <MessageList
      messages={props.thread.messages}
      onClick={props.onMessageClick}
    />
    <TextFieldSubmit
      onSubmit={props.onMessageSubmit}
    />
  </div>
);

// container component!
class ThreadDisplay extends React.Component {
  componentDidMount() {
    store.subscribe(() => this.forceUpdate());
  }
  render() {
    const state = store.getState();
    const activeThreadId = state.activeThreadId;
    const activeThread = state.threads.find(
      t => t.id === activeThreadId
    );
    return (
      <Thread
        thread={activeThread}
        onMessageClick={(id) => (
          store.dispatch({
            type: 'DELETE_MESSAGE',
            id
          })
        )}
        onMessageSubmit={(text) => (
          store.dispatch({
            type: 'ADD_MESSAGE',
            text,
            threadId: activeThreadId
          })
        )}
      />
    );
  }
}

export default App;
