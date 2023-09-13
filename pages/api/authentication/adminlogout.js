
export default async function handler(req, res) {
    res.setHeader('Set-Cookie', 'AdminAuth=deleted; path=/; Max-Age=-1').send();
}