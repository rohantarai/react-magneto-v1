const countKeys = (obj) => {
  return Object.keys(obj).length;
};

const createComponentLayout = (obj, metadata) => {
  let comp = {};
  comp.type = obj.Components;
  comp.attributes = {};
  let config = {};
  for (let i = 1; i < countKeys(obj); i++) {
    if (!isEmpty(obj[`value${i}`])) {
      let key = obj[`property${i}`];
      config[key] = obj[`value${i}`];
    }
  }
  config.library = metadata.library
  comp.attributes = config;
  return comp;
};

const captureMetadata = (obj) => {
  let config = {};
  config.name = obj.value

  for (let i = 1; i < countKeys(obj); i++) {
    if (!isEmpty(obj[`value${i}`])) {
      let key = obj[`property${i}`];
      config[key] = obj[`value${i}`];
    }
  }  
  return config;
};

const createMasterLayout = (compArr) => {
  let masterLayout = {};
  let metadata = captureMetadata(compArr[0])
  masterLayout.componentName = metadata.name.replace(/\s/g,'')
  masterLayout.library = metadata.library
  masterLayout.layout = metadata.layout

  let layoutCompList = [];
  let componentList = compArr.splice(1);
  componentList.forEach((obj) => {
    layoutCompList.push(createComponentLayout(obj, metadata));
  });
  masterLayout.componentList = layoutCompList;
  console.log(masterLayout)
  return masterLayout;
};

const isEmpty = (data) => {
  if (data === "" || data === undefined || data === null) {
    return true;
  }
  return false;
};

/**
 * Converts components attributes into key value pair
 * @param {object} payload - master payload
 */
function updatePayloadAttributes(payload) {
  return new Promise((resolve) => {
    payload.data.forEach((eachPageObj) => {
      eachPageObj.widgets.forEach((eachWidgetObj) => {
        // converting array of widget configuration objects to single object
        let configObj = {};
        eachWidgetObj.configuration.forEach((eachConfigObj) => {
          configObj[eachConfigObj.Property] = eachConfigObj.Value;
        });
        eachWidgetObj.configuration = configObj;
        // release memory
        configObj = null;

        // converting array of children configuration objects to single object
        if (eachWidgetObj.children.length !== 0) {
          eachWidgetObj.children.forEach((eachChildObj) => {
            let childConfigObj = {};
            eachChildObj.configuration.forEach((eachChildConfigObj) => {
              childConfigObj[eachChildConfigObj.Property] =
                eachChildConfigObj.Value;
            });
            eachChildObj.configuration = childConfigObj;
            // release memory
            childConfigObj = null;
          });
        }
      });
    });
    // console.log(JSON.stringify(payload));
    resolve(payload);
  });
}
/**
 * Converts masterPayload to magneto payload
 * @param {object} masterPayload - payload that is received from a different api
 */
async function convertMasterPayload(masterPayload) {
  masterPayload = await updatePayloadAttributes(masterPayload);

  return new Promise((resolve) => {
    let jsonStringPayload = JSON.stringify(
      {
        componentName: "DemoApp",
        pages: [...masterPayload.data]
      },
      null,
      2
    );
    jsonStringPayload = jsonStringPayload.replaceAll("page", "pageName");
    jsonStringPayload = jsonStringPayload.replaceAll(
      "widgets",
      "componentList"
    );
    jsonStringPayload = jsonStringPayload.replaceAll("widget", "type");
    jsonStringPayload = jsonStringPayload.replaceAll(
      "configuration",
      "attributes"
    );
    resolve(jsonStringPayload);
  });
}

module.exports = { createMasterLayout, convertMasterPayload };
