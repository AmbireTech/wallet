import { Alert, ToolTip } from 'components/common'

const FailingTxn = ({ message, tooltip = '' }) => (
  <ToolTip label={tooltip}>
    <Alert size="small" type="danger" title="Warning" text={message} iconNextToTitle />
  </ToolTip>
)

export default FailingTxn
