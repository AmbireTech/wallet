import { useContext } from 'react';
import { ToastContext } from 'components/ToastProvider/ToastProvider';

const useToasts = () => {
    return useContext(ToastContext);
};

export { useToasts };