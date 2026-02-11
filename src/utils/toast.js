import { toast as hotToast } from 'react-hot-toast';

const toast = {
  success: (message, options) => {
    hotToast.dismiss();
    return hotToast.success(message, options);
  },
  error: (message, options) => {
    hotToast.dismiss();
    return hotToast.error(message, options);
  },
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
};

export default toast;
