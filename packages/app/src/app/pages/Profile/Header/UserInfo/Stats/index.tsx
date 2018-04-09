import * as React from 'react';

import Stat from 'app/components/Stat';
import { Badge } from 'app/store/modules/profile/types';

import Badges from './Badges';
import { Container, Stats } from './elements';

export type Props = {
  viewCount: number;
  likeCount: number;
  forkCount: number;
  badges: Badge[];
};

const StatsComponent: React.SFC<Props> = ({
  viewCount,
  likeCount,
  forkCount,
  badges,
}) => (
  <Container>
    <Badges badges={badges} />

    <Stats>
      <Stat name="Likes" count={likeCount} />
      <Stat name="Views" count={viewCount} />
      <Stat name="Forked" count={forkCount} />
    </Stats>
  </Container>
);

export default StatsComponent;
