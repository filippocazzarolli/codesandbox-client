import * as React from 'react';

import Preview from 'app/components/Preview';
import { parseConfigurations } from 'app/store/utils/parse-configurations';
import { mainModule } from 'app/store/utils/main-module';
import { Sandbox } from 'app/store/modules/editor/types';
import { Settings } from 'app/store/modules/preferences/types';
import { Container } from './elements';

export type Props = {
  sandbox: Sandbox;
  settings: Settings;
};

class ShowcasePreview extends React.PureComponent<Props> {
  render() {
    const { sandbox } = this.props;
    const parsedConfigs = parseConfigurations(sandbox);
    const module = mainModule(sandbox, parsedConfigs);

    return (
      <Container>
        <Preview
          sandbox={sandbox}
          currentModule={module}
          settings={this.props.settings}
          isInProjectView
        />
      </Container>
    );
  }
}

export default ShowcasePreview;
