#!/usr/bin/env nodejs

const _DESCRIPTION =
`This tool will delete ALL labels from ALL projects and replace them all
in EVERY project with your GLOBAL GitLab admin labels. You can also specify
this happen to a specific project rather than every project your token can
access. See below.

To get a help message:
gitlab-fix-labels

To completely replace the labels on one project with your custom admin global
defaults (set in the administrator area of GitLab):
gitlab-fix-labels API_STARTPOINT_URI API_AUTH_TOKEN TARGET_PROJECT_ID_NUMBER

To completely replace the labels on ALL projects with your custom admin global
defaults (set in the administrator area of GitLab):
gitlab-fix-labels API_STARTPOINT_URI API_AUTH_TOKEN

Examples:
gitlab-fix-labels https://git.mysite.org/api/v4 myspecial_tokenhere 10
gitlab-fix-labels https://newgitlab.com/api/v5 my2ndspecial_tokenhere
gitlab-fix-labels http://git.lol/api/v4/ myotherspecial_tokenhere

XXX: Note: this tool arbitrarily limits itself to dealing with 100 labels or
less. If your project needs more labels than this, then... wow!`

Promise = require('bluebird');
const ProgressBar = require('progress');
const request = require('request-promise');
const crypto = require('crypto');

const retryLimit = 3;
const retryDelayMs = 100;

const requestDefaults = {
    method: 'GET',
    json: true,
    page: 1,
    per_page: 100,
};

const api = {
    dummyProjectId: -1,
    dummyProjectLabels: [],
    uriFrag: null,
    ignoreParseError: false,
};

const uniqueName = crypto.createHash('sha1').update(JSON.stringify((new Date()))).digest('hex');

const progressBar = new ProgressBar('[:bar] :percent (:elapseds elapsed)',
{
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: 100,
});

request.andKeepRetrying = async (options) =>
{
    let failed = false;
    let failcount = 0;
    let failtime = retryDelayMs;
    let response = null;

    do
    {
        try
        {
            failed = false;
            response = await Promise.delay(failtime).then(() => request(options));
        }
        
        catch(e)
        {
            if(api.ignoreParseError && e.message == 'Error: Parse Error' && e.options.method == 'DELETE')
                failed = false;

            else if(e.error.message == '404 Label Not Found')
            {
                progressBar.interrupt(
`<${Date.now()}> IGNORING parse error HPE_INVALID_CONSTANT. With the previous
    request, GitLab erroneously returned more data than it told node to expect. This
    GitLab problem will be ignored for the remainder of execution.`);
            
                api.ignoreParseError = true;
            }

            else
            {
                failed = true;
                failtime += retryDelayMs;
                
                if(++failcount > retryLimit)
                    throw e;

                progressBar.interrupt(`<${Date.now()}> RETRYING failed request in ${failtime}ms...`);
            }
        }
    } while(failed);

    return response;
};

api.createDummyProject = async () =>
{
    if(api.dummyProjectId != -1)
        throw 'createDummyProject called while dummy project already exists!';

    let result = await request.andKeepRetrying(Object.assign({}, requestDefaults,
    {
        method: 'POST',
        url: api.uriFrag + `projects`,
        body: {
            visibility: 'private',
            name: `deleteme-${uniqueName}`
        }
    }));

    return api.dummyProjectId = result.id;
};

api.deleteDummyProject = () =>
{
    if(api.dummyProjectId == -1)
        throw 'deleteDummyProject called before createDummyProject';

    return request.andKeepRetrying(Object.assign({}, requestDefaults,
    {
        method: 'DELETE',
        url: api.uriFrag + `projects/${api.dummyProjectId}`,
    })).then(() => api.dummyProjectId = -1);
};

api.getDummyProjectLabels = async () =>
{
    if(api.dummyProjectLabels.length)
        return api.dummyProjectLabels;

    if(api.dummyProjectId == -1)
        throw 'getDummyProjectLabels called before createDummyProject';

    return api.dummyProjectLabels = await api.getProjectLabels(api.dummyProjectId);
};

api.getProjectLabels = (projectId) =>
{
    return request.andKeepRetrying(Object.assign({}, requestDefaults,
    {
        url: api.uriFrag + `projects/${projectId}/labels`,
    }));
};

api.deleteProjectLabels = async (projectId) =>
{
    let labels = await api.getProjectLabels(projectId);

    return Promise.each(labels, async label =>
    {
        await request.andKeepRetrying(Object.assign({}, requestDefaults,
        {
            method: 'DELETE',
            url: api.uriFrag + `projects/${projectId}/labels`,
            qs: {
                name: label.name
            }
        }));
    });
};

api.copyDummyProjectLabelsTo = async (toProjectId) =>
{
    let labels = await api.getDummyProjectLabels();

    return Promise.each(labels, async label =>
    {
        await request.andKeepRetrying(Object.assign({}, requestDefaults,
        {
            method: 'POST',
            url: api.uriFrag + `projects/${toProjectId}/labels`,
            qs: {
                name: label.name,
                color: label.color,
                description: label.description,
            }
        }));
    });
};

api.getAllProjectIds = async () =>
{
    let ids = [];
    let interim_result = false;
    let page = 0;

    do
    {
        interim_results = false;

        let results = await request.andKeepRetrying(Object.assign({}, requestDefaults,
        {
            url: api.uriFrag + `projects`,
            qs: {
                order_by: 'id',
                simple: true,
                page: ++page,
            }
        }));

        results.forEach(project =>
        {
            if(project.id != api.dummyProjectId)
            {
                interim_results = true;
                ids.push(project.id);
            }
        });
        
    } while(interim_results);

    return ids;
};

let error = false;

(async () =>
{
    const apiStartpointUri = process.argv[2];
    const apiAuthToken = process.argv[3];
    const targetProjectId = parseInt(process.argv[4]) || 0;

    if(apiStartpointUri && apiAuthToken)
    {
        api.uriFrag = apiStartpointUri + (apiStartpointUri[apiStartpointUri.length - 1] == '/' ? '' : '/');
        requestDefaults.headers = { 'PRIVATE-TOKEN': apiAuthToken };

        console.info('Attempting to replace labels on', (targetProjectId ? `project id #"${targetProjectId}"` : 'all projects')) + '...';

        const interval = setInterval(() => { progressBar.render(); }, 200);

        try
        {
            progressBar.tick(1);

            await api.createDummyProject();

            progressBar.tick(19);

            await api.getDummyProjectLabels();

            progressBar.tick(20);

            if(targetProjectId)
            {
                await api.deleteProjectLabels(targetProjectId);

                progressBar.tick(20);

                await api.copyDummyProjectLabelsTo(targetProjectId);

                progressBar.tick(39);
            }

            else
            {
                let projectIds = await api.getAllProjectIds();

                progressBar.tick(20);

                let tock = 39 / projectIds.length;

                await Promise.each(projectIds, async projectId =>
                {
                    try
                    {
                        await api.deleteProjectLabels(projectId);
                        await api.copyDummyProjectLabelsTo(projectId);
                    }

                    catch(e)
                    {
                        progressBar.interrupt(`<${Date.now()}> FAILURE for #"${projectId}": (${e})`);
                    }

                    progressBar.tick(tock);
                });
            }

            await api.deleteDummyProject();

            progressBar.tick(1);

            clearInterval(interval);
            progressBar.render();
            progressBar.terminate();

            console.info('Done!');
        }

        catch(e)
        {
            progressBar.interrupt(`<${Date.now()}> FATAL error: ${e}`);
            error = true;
        }

        finally
        {
            if(error)
            {
                await api.deleteDummyProject();

                clearInterval(interval);
                progressBar.render();
                progressBar.terminate();

                console.info('(removed dummy project)');
            }
        }
    }

    else
        console.info(_DESCRIPTION);
})();
