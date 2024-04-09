import { createHashRouter } from 'react-router-dom'

import App, { AppIndex } from './routes/Overview'
import NewConversation from './routes/NewConversation'
import ConversationChat from './routes/ConversationChat'

export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <AppIndex />,
      },
      {
        path: "conversations/:conversationId",
        element: <ConversationChat />,
      }
    ]
  },
  {
    path: "/new-conversation",
    element: <NewConversation />,
  },
])
