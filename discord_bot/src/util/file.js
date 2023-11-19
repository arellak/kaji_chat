import fs from "fs";
import path from "path";

const filePath = path.resolve("./data/model.json");

export const readJson = () => {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    catch (error){
        return {};
    }
};

export const writeJson = (data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    catch (error){
        console.log(error);
    }
};

