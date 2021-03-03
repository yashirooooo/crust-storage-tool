const chalk = require('chalk');
const figlet = require('figlet');
const program = require('commander');
const calculate = require('./calculate').default;
const { withHelper } = require('./util');

program
  .version('0.0.1')
  .description(
    'The Crust Storage Tool command-line interface (CST CLI) is a set of commands used to access Crust Network storage resources'
  )

program
  .command('cal')
  .description('Calculate the orders of all members of the current owner and use the incoming seed to send the transaction')
  .option('-o --owner [value]', 'Address of your group owner')
  .option('-s, --seeds [value]', 'Secret seeds of your Crust Account, 12 words')
  .action((args) => withHelper(args, () => program.help(), () => calculate(args.owner ,args.seeds)))

program.addHelpText('before', chalk.green(figlet.textSync('crust-storage-tool', {horizontalLayout: 'full'})));

program.parse(process.argv)