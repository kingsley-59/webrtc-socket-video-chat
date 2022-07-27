import './App.css';
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom'
import { lazy, Suspense } from 'react';


const Contacts = lazy(() => import('./screens/Contacts'))
const TestRoom = lazy(() => import('./screens/TestRoom'))
const VideoRoom = lazy(() => import('./screens/VideoRoom'))

const Loading = () => {
  return (
    <div>Loading...</div>
  )
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path='/' element={<Contacts />} />
        <Route path='testroom' element={<TestRoom />} />
        <Route path='videoroom' element={<VideoRoom />} >
          <Route path=':userId' element={<VideoRoom />} />
        </Route>
      </Routes>
    </Suspense>
    
  )
}

export default App;
