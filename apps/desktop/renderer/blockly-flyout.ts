import * as Blockly from 'blockly';
import {localizeBlocks} from './block-locale';

export function createLocalizedFlyout(getPresentation: () => {
  locale: Parameters<typeof localizeBlocks>[1];
  physicalMotors: boolean;
}) {
  return class LocalizedFlyout extends Blockly.VerticalFlyout {
    protected override layout_(contents: Blockly.FlyoutItem[]) {
      const workspace = this.getWorkspace();
      const {locale, physicalMotors} = getPresentation();
      localizeBlocks(workspace, locale, physicalMotors);
      Blockly.renderManagement.triggerQueuedRenders(workspace);
      super.layout_(contents);
    }
  };
}
