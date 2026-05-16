export function getNaverLinks(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    web: `https://map.naver.com/v5/search/${encoded}`,
    ios: `nmap://search?query=${encoded}&appname=com.joe.gmap2nmap`,
    android: `intent://search?query=${encoded}&appname=com.joe.gmap2nmap#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`
  };
}
