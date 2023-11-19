import cron from "node-cron";
import Log from "../util/log.js";
import removeOldLogs from "../crons/removeOldLogs.js";

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

/**
 * Schedule all crons
 *
 */
const scheduleCrons = async function(){
    // daily cron
    cron.schedule("0 0 * * *", () => {
        removeOldLogs();
    });

    const cronCount = cron.getTasks().size;
    Log.done("Scheduled " + cronCount + " Crons.");

    // start jobs on init
    await removeOldLogs();
};

export default scheduleCrons;
