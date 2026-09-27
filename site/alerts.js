(() => {
  'use strict';
  const theme = () => window.Swal.mixin({
    background: '#211a30', color: '#f7f3ff', confirmButtonColor: '#e96d96',
    cancelButtonColor: '#554666', customClass: { popup: 'rrih-swal' },
    showClass: { popup: 'swal2-show' }, hideClass: { popup: 'swal2-hide' },
  });
  const fallback = (message) => { window.alert(message); return Promise.resolve({ isConfirmed: true }); };
  const fire = options => window.Swal ? theme().fire(options) : fallback(options.text || options.title || '');
  window.RRIHAlerts = {
    fire,
    notice: (icon, title, text = '') => fire({ icon, title, text }),
    toast: (icon, title) => window.Swal ? theme().fire({ icon, title, toast: true,
      position: 'top-end', showConfirmButton: false, timer: 3500, timerProgressBar: true }) : fallback(title),
    loading: title => {
      if (!window.Swal) return;
      theme().fire({ title, allowOutsideClick: false, allowEscapeKey: false,
        showConfirmButton: false, didOpen: () => window.Swal.showLoading() });
    },
    close: () => { if (window.Swal) window.Swal.close(); },
  };
})();
