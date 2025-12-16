// nativewind.plugin.js
module.exports = function ({ addUtilities }) {
  addUtilities({
    '.outline': {
      textShadow: '#632f16 1px 1px 3px',
      outlineStyle: 'none',
    },

    '.debug-red': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'red',
      backgroundColor: 'pink',
    },

    '.debug-green': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'green',
      backgroundColor: 'lightgreen',
    },

    '.debug-blue': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'blue',
      backgroundColor: 'lightblue',
    },

    '.debug-cyan': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'cyan',
      backgroundColor: 'lightcyan',
    },
  });
};
