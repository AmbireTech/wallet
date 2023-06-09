// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// It's fixing the following error, when we run `npm run test`:
// ReferenceError: TextEncoder is not defined
// @credits https://github.com/inrupt/solid-client-authn-js/issues/1676
import { TextEncoder, TextDecoder } from 'util'

import 'jest-canvas-mock'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
