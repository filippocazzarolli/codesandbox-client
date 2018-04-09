import * as React from 'react';

import Button from '../Button';
import { Container, Title, Text, Buttons } from './elements';

export type Props = {
  title: string;
  body: string | React.ReactNode;
  onCancel: () => void;
  onDelete: () => void;
};

const Alert: React.SFC<Props> = ({ title, body, onCancel, onDelete }) => (
  <Container>
    <Title>{title}</Title>
    <Text>{body}</Text>
    <Buttons>
      <Button small block secondary onClick={onCancel}>
        Cancel
      </Button>
      <Button small block primary onClick={onDelete}>
        Delete
      </Button>
    </Buttons>
  </Container>
);

export default Alert;
