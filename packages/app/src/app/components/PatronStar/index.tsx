import * as React from 'react';
import * as moment from 'moment';
import StarIcon from 'react-icons/lib/go/star';

import { Container } from './elements';

export type Props = {
  subscriptionSince: string;
  style?: React.CSSProperties;
};

const PatronStar: React.SFC<Props> = ({ subscriptionSince, ...props }) => (
  <Container
    title={`Patron since ${moment(subscriptionSince).format('MMM Y')}`}
  >
    <StarIcon {...props} />
  </Container>
);

export default PatronStar;
