import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import ToastProvider from 'context/ToastProvider/ToastProvider'
import ModalProvider from 'context/ModalProvider/ModalProvider'
import { ConstantsContext } from 'context/ConstantsProvider/ConstantsProvider'
import Transfer from './Transfer'

const humanizerInfo = {
  names: {
    '0x0F545C6178830e249117B5162120378735FDD635': 'SwappinGatewayV2'
  },
  tokens: {
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': ['USDT', 6]
  }
}

// Utilities
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route)

  return {
    user: userEvent.setup(),
    ...render(
      <ConstantsContext.Provider value={{ constants: { humanizerInfo } }}>
        <ToastProvider>
          <ModalProvider>{ui}</ModalProvider>
        </ToastProvider>
      </ConstantsContext.Provider>,
      { wrapper: BrowserRouter }
    )
  }
}

// Mocks
const addressBook = {
  addresses: [],
  addAddress: () => {},
  removeAddress: () => {},
  isKnownAddress: () => {}
}
const portfolio = {
  tokens: [
    {
      address: '0x0000000000000000000000000000000000000000',
      balance: 1.73827215,
      balanceRaw: '1738272150008324290',
      balanceUSD: 1.5,
      decimals: 18,
      isHidden: false,
      network: 'polygon',
      price: 0.865552,
      symbol: 'MATIC',
      tokenImageUrl:
        'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912',
      type: 'base',
      updateAt: 'Thu Jul 21 2022 17:36:12 GMT+0300 (Eastern European Summer Time)'
    }
  ]
}
const selectedNetwork = {
  id: 'polygon',
  chainId: 137
}
const userAddress = '0x9a8b505305d8499e4D4393f8677169b9a4c9fa67'

const usdtTokenContract = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'

test('it should not be allowed to send tokens to your own address', async () => {
  const { user } = renderWithRouter(
    <Transfer
      portfolio={portfolio}
      selectedNetwork={selectedNetwork}
      addressBook={addressBook}
      selectedAcc={userAddress}
    />
  )
  const button = screen.getByText('MAX')
  await user.click(button)

  const addressInput = screen.getByTestId('recipient')
  await user.type(addressInput, userAddress)

  const error = await screen.findByText(
    /The entered address should be different than the your own account address/i
  )

  expect(error).toBeInTheDocument()
})

test('can send token', async () => {
  const addRequest = jest.fn()
  const { user } = renderWithRouter(
    <Transfer
      portfolio={portfolio}
      selectedNetwork={selectedNetwork}
      addressBook={addressBook}
      selectedAcc={userAddress}
      addRequest={addRequest}
    />)
  const selectAnAsset = screen.getByText('Select an asset')
  await user.click(selectAnAsset)
  const selectMatic = screen.getByText('MATIC')
  await user.click(selectMatic)

  await user.click(screen.getByText('Select an asset'))
  await user.click(screen.getByText('MATIC'))

  const maxButton = screen.getByText('MAX')
  await user.click(maxButton)

  const addressInput = screen.getByTestId('recipient')
  await user.type(addressInput, '0x72386e45Bf764CF7D5233231BAD8caa8923d0Ed3')

  const confirm = screen.getByTestId('unknownAddressWarning')
  await user.click(confirm)

  const confirmBinance = screen.getByText(/I confirm this address is not /i)
  await user.click(confirmBinance)

  const sendButton = screen.getByTestId('send')
  await user.click(sendButton)

  expect(addRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'eth_sendTransaction',
      chainId: selectedNetwork.chainId,
      account: userAddress,
      txn: {
        to: '0x72386e45Bf764CF7D5233231BAD8caa8923d0Ed3',
        value: '0x181f954f883360c2',
        data: '0x'
      }
    })
  )
})

// TODO: the `user.type(addressInput, usdtTokenContract)` part does not trigger
// the validation which outputs the "trying to send tokens to a smart contract"
// warn. Figure out why.
test.skip('it should not be allowed to send tokens to known token or contract', async () => {
  const { user } = renderWithRouter(
    <Transfer
      portfolio={portfolio}
      selectedNetwork={selectedNetwork}
      addressBook={addressBook}
      selectedAcc={userAddress}
    />
  )
  const button = screen.getByText('MAX')
  await user.click(button)

  const addressInput = screen.getByTestId('recipient')
  await user.type(addressInput, usdtTokenContract)

  const confirm = screen.getByTestId('unknownAddressWarning')
  await user.click(confirm)

  const confirmBinance = screen.getByText(/I confirm this address is not a/i)
  await user.click(confirmBinance)

  const error = await screen.findByText(
    /You are trying to send tokens to a smart contract. Doing so would burn them/i
  )

  expect(error).toBeVisible()
})
