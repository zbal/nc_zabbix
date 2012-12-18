// Initialize
// ----------
window.app = {
    models: {},
    views: {},
    routers: {},
    templates: _($('script[name]')).reduce(function(memo, el) {
        memo[el.getAttribute('name')] = _(el.innerHTML).template();
        return memo;
    }, {})
};
window.args = _(window.app).toArray();

window.utils = {};
utils.capitaliseFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
