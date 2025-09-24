// utils/catchAsync.js
export const catchAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next); // Pass error to centralized handler
  };
};
