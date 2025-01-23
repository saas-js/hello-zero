import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Provider } from '../provider.tsx'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <Provider>
        <Outlet />
      </Provider>
    </React.Fragment>
  )
}
