import * as React from 'react';
import Tooltip from 'common/components/Tooltip';

import PlayIcon from 'react-icons/lib/go/playback-play';
import FileIcon from 'react-icons/lib/md/insert-drive-file';

import { File, Status } from 'app/components/Preview/DevTools/Tests/types';

import {
  Container,
  FileName,
  Path,
  Tests,
  FileData,
  Test,
  Block,
  TestName,
  Actions,
} from './elements';

import { StatusElements } from '../elements';

export type Props = {
  file: File;
  selectFile: (file: File) => void;
  selectedFile?: File;
  status: Status;
  runTests: (file: File) => void;
  openFile: (path: string) => void;
};

class TestElement extends React.Component<Props> {
  selectFile = () => {
    this.props.selectFile(this.props.file);
  };

  runTests = (e: MouseEvent) => {
    e.preventDefault();
    this.props.runTests(this.props.file);
  };

  openFile = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.openFile(this.props.file.fileName);
  };

  render() {
    const { file, status } = this.props;

    const splittedPath = file.fileName.split('/');
    const fileName = splittedPath.pop();

    const testKeys = Object.keys(file.tests);

    const StatusElement = StatusElements[status];

    return (
      <Container
        onClick={this.selectFile}
        selected={file === this.props.selectedFile}
      >
        <FileData>
          <StatusElement />
          <Path>{splittedPath.join('/')}/</Path>
          <FileName>{fileName}</FileName>
          <Actions>
            <Tooltip title="Open File">
              <FileIcon onClick={this.openFile} />
            </Tooltip>
            <Tooltip title="Run Tests">
              <PlayIcon onClick={this.runTests} />
            </Tooltip>
          </Actions>
        </FileData>

        <Tests>
          {testKeys.filter(t => file.tests[t].status === 'fail').map(tName => {
            const test = file.tests[tName];

            const TestStatusElement = StatusElements[test.status];
            const testParts = [...test.testName];
            const testName = testParts.pop();
            return (
              <Test key={tName}>
                <TestStatusElement />
                {testParts.map((part, i) => (
                  <Block last={i === testParts.length - 1} key={part}>
                    <span style={{ zIndex: 10 }}>{part}</span>
                  </Block>
                ))}
                <TestName>{testName}</TestName>
              </Test>
            );
          })}
        </Tests>
      </Container>
    );
  }
}

export default TestElement;
