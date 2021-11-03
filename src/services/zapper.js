const request = async url => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.json();
};

export const supportedBalances = (apiKey) => {
    return request(`https://api.zapper.fi/v1/protocols/balances/supported?api_key=${apiKey}`);
};

export const getBalances = (apiKey, network, protocol, address) => {
    return request(`https://api.zapper.fi/v1/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`);
};