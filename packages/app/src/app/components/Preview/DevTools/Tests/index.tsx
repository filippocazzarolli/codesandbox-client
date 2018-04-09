/* eslint-disable no-param-reassign */
import * as React from 'react';
import { actions, dispatch, listen } from 'codesandbox-api';
import SplitPane from 'react-split-pane';

import immer from 'immer';

import { Container, TestDetails, TestContainer } from './elements';

import TestElement from './TestElement';
import TestDetailsContent from './TestDetails';
import TestSummary from './TestSummary';
import TestOverview from './TestOverview';

import { Status } from './types';

export type Props = {
  hidden: boolean;
  sandboxId: string;
  updateStatus: (
    type: 'success' | 'warning' | 'error' | 'info' | 'clear',
    count?: number
  ) => void;
};

export type TestError = Error & {
  matcherResult?: boolean;
  mappedErrors?: Array<{
    fileName: string;
    _originalFunctionName: string;
    _originalColumnNumber: number;
    _originalLineNumber: number;
    _originalScriptCode: Array<{
      lineNumber: number;
      content: string;
      highlight: boolean;
    }>;
  }>;
};

export type Test = {
  testName: string[];
  duration?: number;
  status: Status;
  errors: TestError[];
  running: boolean;
  path: string;
};

export type File = {
  fileName: string;
  fileError?: TestError;
  tests: {
    [testName: string]: Test;
  };
};

type State = {
  selectedFilePath?: string;
  files: {
    [path: string]: File;
  };
  running: boolean;
  watching: boolean;
};

const INITIAL_STATE = {
  files: {},
  selectedFilePath: null,
  running: true,
  watching: true,
};

class Tests extends React.Component<Props, State> {
  state = INITIAL_STATE;
  listener: () => void;
  currentDescribeBlocks: string[] = [];
  lastFiles: {
    [path: string]: {
      file: File;
      status: Status;
    };
  } = {};

  componentDidMount() {
    this.listener = listen(this.handleMessage);
  }

  componentWillUnmount() {
    if (this.listener) {
      this.listener();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.sandboxId !== this.props.sandboxId) {
      this.setState({
        files: {},
        selectedFilePath: null,
        running: true,
      });
    }
  }

  selectFile = (file: File) => {
    this.setState({
      selectedFilePath:
        file.fileName === this.state.selectedFilePath ? null : file.fileName,
    });
  };

  handleMessage = (data: any) => {
    if (data.type === 'test') {
      switch (data.event) {
        case 'initialize_tests': {
          this.currentDescribeBlocks = [];
          this.props.updateStatus('clear');
          this.setState(INITIAL_STATE);
          break;
        }
        case 'total_test_start': {
          this.currentDescribeBlocks = [];
          this.props.updateStatus('clear');
          this.setState({
            ...this.state,
            running: true,
          });
          break;
        }
        case 'total_test_end': {
          this.setState({
            ...this.state,
            running: false,
          });

          const files = Object.keys(this.state.files);
          const failingTests = files.filter(
            f => this.getStatus(this.state.files[f]) === Status.FAIL
          ).length;
          const passingTests = files.filter(
            f => this.getStatus(this.state.files[f]) === Status.PASS
          ).length;

          if (failingTests > 0) {
            this.props.updateStatus('error', failingTests);
          } else if (passingTests === files.length) {
            this.props.updateStatus('success', passingTests);
          } else {
            // Not all tests are run
            this.props.updateStatus('warning', files.length - passingTests);
          }

          break;
        }

        case 'add_file': {
          this.setState(
            immer(this.state, state => {
              state.files[data.path] = {
                tests: {},
                fileName: data.path,
              };
            })
          );
          break;
        }
        case 'remove_file': {
          this.setState(
            immer(this.state, state => {
              if (state.files[data.path]) {
                delete state.files[data.path];
              }
            })
          );
          break;
        }
        case 'file_error': {
          this.setState(
            immer(this.state, state => {
              if (state.files[data.path]) {
                state.files[data.path].fileError = data.error;
              }
            })
          );
          break;
        }
        case 'describe_start': {
          this.currentDescribeBlocks.push(data.blockName);
          break;
        }
        case 'describe_end': {
          this.currentDescribeBlocks.pop();
          break;
        }
        case 'add_test': {
          const testName = [...this.currentDescribeBlocks, data.testName];

          this.setState(
            immer(this.state, state => {
              if (!state.files[data.path]) {
                state.files[data.path] = {
                  tests: {},
                  fileName: data.path,
                };
              }

              state.files[data.path].tests[testName.join('||||')] = {
                status: Status.IDLE,
                errors: [],
                testName,
                path: data.path,
              };
            })
          );
          break;
        }
        case 'test_start': {
          const { test } = data;
          const testName = [...test.blocks, test.name];

          this.setState(
            immer(this.state, state => {
              const currentTest =
                state.files[test.path].tests[testName.join('||||')];
              if (!currentTest) {
                state.files[test.path].tests[testName.join('||||')] = {
                  status: Status.RUNNING,
                  running: true,
                  testName,
                  path: test.path,
                };
              } else {
                currentTest.status = Status.RUNNING;
                currentTest.running = true;
              }
            })
          );
          break;
        }
        case 'test_end': {
          const { test } = data;
          const testName = [...test.blocks, test.name];

          this.setState(
            immer(this.state, state => {
              const existingTest =
                state.files[test.path].tests[testName.join('||||')];

              if (existingTest) {
                existingTest.status = test.status;
                existingTest.running = false;
                existingTest.errors = test.errors;
                existingTest.duration = test.duration;
              } else {
                state.files[test.path].tests[testName.join('||||')] = {
                  status: test.status,
                  running: false,
                  errors: test.errors,
                  duration: test.duration,
                  testName,
                  path: test.path,
                };
              }
            })
          );
          break;
        }
        default: {
          break;
        }
      }
    }
  };
  getStatus = (file?: File): Status => {
    if (file == null) {
      return Status.IDLE;
    }

    const lastFile = this.lastFiles[file.fileName];

    // Simple memoization
    if (lastFile && file === lastFile.file && lastFile.status != null) {
      return lastFile.status;
    }

    if (file.fileError) {
      return Status.FAIL;
    }

    const { tests } = file;
    const status = Object.keys(tests).reduce((prev, next) => {
      const test = tests[next];
      if (test.status !== Status.IDLE && prev === Status.IDLE) {
        return test.status;
      }

      if (test.status === Status.PASS || prev !== Status.PASS) {
        return prev;
      }

      if (test.status === Status.FAIL) {
        return Status.FAIL;
      }

      if (test.status === Status.RUNNING) {
        return Status.RUNNING;
      }

      return prev;
    }, Status.IDLE) as Status;

    this.lastFiles[file.fileName] = { file, status };

    return status;
  };

  toggleWatching = () => {
    dispatch({
      type: 'set-test-watching',
      watching: !this.state.watching,
    });
    this.setState({ watching: !this.state.watching });
  };

  runAllTests = () => {
    this.setState({ files: {} }, () => {
      dispatch({
        type: 'run-all-tests',
      });
    });
  };

  runTests = (file: File) => {
    this.setState(
      immer(this.state, state => {
        state.files[file.fileName].tests = {};
      }),
      () => {
        dispatch({
          type: 'run-tests',
          path: file.fileName,
        });
      }
    );
  };

  openFile = (path: string) => {
    dispatch(actions.editor.openModule(path));
  };

  render() {
    if (this.props.hidden) {
      return null;
    }

    const { selectedFilePath } = this.state;
    const selectedFile = this.state.files[selectedFilePath || ''];

    const fileStatuses = {};
    Object.keys(this.state.files).forEach(path => {
      fileStatuses[path] = this.getStatus(this.state.files[path]);
    });

    const tests = [];
    Object.keys(this.state.files).forEach(path => {
      const file = this.state.files[path];
      Object.keys(file.tests).forEach(t => {
        tests.push(file.tests[t]);
      });
    });

    return (
      <Container>
        <SplitPane split="vertical" defaultSize={450}>
          <TestContainer>
            <TestSummary
              running={this.state.running}
              watching={this.state.watching}
              toggleWatching={this.toggleWatching}
              runAllTests={this.runAllTests}
              fileStatuses={fileStatuses}
              files={this.state.files}
              tests={tests}
            />

            <div style={{ marginTop: '1rem' }}>
              {Object.keys(this.state.files)
                .sort()
                .map(fileName => (
                  <TestElement
                    selectFile={this.selectFile}
                    selectedFile={selectedFile}
                    file={this.state.files[fileName]}
                    status={fileStatuses[fileName]}
                    key={fileName}
                    runTests={this.runTests}
                    openFile={this.openFile}
                  />
                ))}
            </div>
          </TestContainer>
          <TestDetails>
            {selectedFile ? (
              <TestDetailsContent
                status={this.getStatus(selectedFile)}
                file={selectedFile}
                openFile={this.openFile}
                runTests={this.runTests}
              />
            ) : (
              <TestOverview tests={tests} openFile={this.openFile} />
            )}
          </TestDetails>
        </SplitPane>
      </Container>
    );
  }
}

export default {
  title: 'Tests',
  Content: Tests,
  actions: [],
};
