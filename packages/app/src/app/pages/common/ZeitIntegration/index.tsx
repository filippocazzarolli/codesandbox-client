import * as React from 'react';
import { connect, WithCerebral } from 'app/fluent';

import ZeitLogo from 'app/components/ZeitLogo';
import Integration from 'app/components/Integration';

type ExternalProps = {
  small?: boolean;
};

export type Props = ExternalProps & WithCerebral;

const ZeitIntegration: React.SFC<Props> = ({ store, signals, small }) => (
  <Integration
    name="ZEIT"
    small={small}
    color="black"
    description="Deployments"
    Icon={ZeitLogo}
    userInfo={store.user.integrations.zeit}
    signIn={() => signals.signInZeitClicked()}
    signOut={() => signals.signOutZeitClicked()}
    loading={store.isLoadingZeit}
  />
);

export default connect<ExternalProps>()(ZeitIntegration);
