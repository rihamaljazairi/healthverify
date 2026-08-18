export const compareImages = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.floor(Math.random() * 100));
    }, 1000);
  });
};