// nativewind.plugin.js
module.exports = function ({ addUtilities }) {
  addUtilities({
    '.outline': {
      textShadow:
        '-1px -1px 0 #2b262c, 1px -1px 0 #2b262c, -1px 1px 0 #2b262c, 1px 1px 0 #2b262c, -1px 0 0 #2b262c, 1px 0 0 #2b262c, 0 -1px 0 #2b262c, 0 1px 0 #2b262c',
      outlineStyle: 'none',
    },

    '.debug-red': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'red',
      backgroundColor: 'rgba(255, 192, 203, 0.5)',
    },

    '.debug-green': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'green',
      backgroundColor: 'rgba(144, 238, 144, 0.5)',
    },

    '.debug-blue': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'blue',
      backgroundColor: 'rgba(173, 216, 230, 0.5)',
    },

    '.debug-cyan': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'cyan',
      backgroundColor: 'rgba(224, 255, 255, 0.5)',
    },

    '.debug-yellow': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'yellow',
      backgroundColor: 'rgba(255, 255, 224, 0.5)',
    },

    '.debug-gray': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'gray',
      backgroundColor: 'rgba(211, 211, 211, 0.5)',
    },

    '.debug-black': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'black',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    '.debug-border-red': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'red',
    },

    '.debug-border-green': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'green',
    },

    '.debug-border-blue': {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'blue',
    },
  });
};
