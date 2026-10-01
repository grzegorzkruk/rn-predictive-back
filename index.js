import 'react-native-reanimated';
import {AppRegistry} from 'react-native';
import App from './src/App';
import BrownfieldEmbed from './src/BrownfieldEmbed';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('BrownfieldEmbed', () => BrownfieldEmbed);
