module.exports = function() {
    var client = './app/';
    var build = './dist/';

    var config = {
        build: build,
        client: client,
        index: client + 'index.jsp',
        images: ['**/images/**/*.*', '**/img/**/*.*']
    };

    return config;
};