import * as React from 'react';
import { listen, dispatch, actions } from 'codesandbox-api';
import Tooltip from 'common/components/Tooltip';
import FileIcon from 'react-icons/lib/md/insert-drive-file';

import { Container, File, Path, FileName, Actions } from './elements';
import Message from '../Console/Message';

export type Props = {
  updateStatus: (status: string) => void;
  hidden: boolean;
};

type State = {
  corrections: {
    [path: string]: string[];
  };
};

class Problems extends React.PureComponent<Props, State> {
  state = {
    corrections: {},
  };
  listener: () => void;
  componentDidMount() {
    this.listener = listen(this.handleMessage);
  }

  componentWillUnmount() {
    this.listener();
  }

  handleMessage = data => {
    if (data.action === 'show-correction') {
      const path = data.path || 'root';

      const newMessages = [
        ...(this.state.corrections[path] || []),
        { type: 'warn', message: data.message },
      ];

      this.setState({
        corrections: {
          ...this.state.corrections,
          [path]: newMessages,
        },
      });

      this.props.updateStatus('warning');
    } else if (data.action === 'show-error') {
      const path = data.path || 'root';

      const newMessages = [
        ...(this.state.corrections[path] || []),
        { type: 'error', message: data.message },
      ];

      this.setState({
        corrections: {
          ...this.state.corrections,
          [path]: newMessages,
        },
      });

      this.props.updateStatus('error');
    } else if (data.type === 'start') {
      this.setState({ corrections: {} });
      this.props.updateStatus('clear');
    }
  };

  openFile = (path: string) => {
    dispatch(actions.editor.openModule(path));
  };

  render() {
    if (this.props.hidden) {
      return null;
    }

    const files = Object.keys(this.state.corrections)
      .sort()
      .filter(x => x !== 'root');

    const { root } = this.state.corrections as any;

    return (
      <Container>
        {Object.keys(this.state.corrections).length === 0 && (
          <div style={{ padding: '1rem' }}>No problems!</div>
        )}
        {root && (
          <div>
            <File>Root</File>
            {root.map((message, i) => (
              <Message
                message={{
                  logType: message.type,
                  arguments: [message.message],
                }}
                // eslint-disable-next-line react/no-array-index-key
                key={i}
              />
            ))}
          </div>
        )}
        {files.map(file => {
          const splittedPath = file.split('/');
          const fileName = splittedPath.pop();

          return (
            <div key={file}>
              <File>
                <Path>{splittedPath.join('/')}/</Path>
                <FileName>{fileName}</FileName>
                <Actions>
                  <Tooltip title="Open File">
                    <FileIcon onClick={() => this.openFile(file)} />
                  </Tooltip>
                </Actions>
              </File>
              {this.state.corrections[file].map((message, i) => (
                <Message
                  message={{
                    logType: message.type,
                    arguments: [message.message],
                  }}
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                />
              ))}
            </div>
          );
        })}
      </Container>
    );
  }
}

export default {
  title: 'Problems',
  Content: Problems,
  actions: [],
};
