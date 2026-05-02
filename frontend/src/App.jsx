import Chrome from './components/Chrome';
import { useStore } from './lib/store';
import { useRoute } from './lib/router';
import UploadScreen from './screens/Upload';
import AnalyseScreen from './screens/Analyse';
import GenerateScreen from './screens/Generate';

export default function App() {
  const route = useRoute();
  const [state] = useStore();

  let stage = 'upload';
  let screen = <UploadScreen />;
  if (route.name === 'analyse')  { stage = 'analyse';  screen = <AnalyseScreen />; }
  if (route.name === 'generate') { stage = 'generate'; screen = <GenerateScreen />; }

  return (
    <>
      <Chrome stage={stage} file={state.video?.filename} />
      {screen}
    </>
  );
}
