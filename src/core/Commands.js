export default class {
    constructor() {
        process.stdin.on("data", stdin => {
            const command = stdin.toString().split(' ');

            switch (command[0]) {
                case 'refresh' :
                    this.refreshEndpoints(command [1]);
            }
        })
    }

    refreshEndpoints(api) {
        console.log('atualizar endpoinst de ' + api);
    }
}