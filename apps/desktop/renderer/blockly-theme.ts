import * as Blockly from 'blockly';
const themes={
 light:Blockly.Theme.defineTheme('jective-light',{name:'jective-light',base:Blockly.Themes.Classic,componentStyles:{workspaceBackgroundColour:'#fafbfc',toolboxBackgroundColour:'#f1f2f5',toolboxForegroundColour:'#525968',flyoutBackgroundColour:'#e9edf3',flyoutForegroundColour:'#20232b',flyoutOpacity:.98,scrollbarColour:'#b6bdc9',insertionMarkerColour:'#211dff',insertionMarkerOpacity:.3},fontStyle:{family:'Segoe UI',size:12,weight:'500'}}),
 dark:Blockly.Theme.defineTheme('jective-dark',{name:'jective-dark',base:Blockly.Themes.Classic,componentStyles:{workspaceBackgroundColour:'#191c22',toolboxBackgroundColour:'#22262f',toolboxForegroundColour:'#bec5d2',flyoutBackgroundColour:'#2a303a',flyoutForegroundColour:'#edf0f6',flyoutOpacity:.98,scrollbarColour:'#4b5364',insertionMarkerColour:'#aaa6ff',insertionMarkerOpacity:.4},fontStyle:{family:'Segoe UI',size:12,weight:'500'}})
};
export const blocklyTheme=(theme:'light'|'dark')=>themes[theme];
