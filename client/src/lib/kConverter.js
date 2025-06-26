export const kConverter = (k) => {
  if (k >= 1000) {
    return (k / 1000).toFixed(1) + "k";
  } else {
    return k;
  }
};
