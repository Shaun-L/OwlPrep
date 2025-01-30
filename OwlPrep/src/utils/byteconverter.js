export function byteConverter(bytes){
    let kb = bytes / 1024;

    if(kb < 1048576){
        return `${kb.toFixed()}KB`
    }else{
        let gb = kb/1048576
        return `${gb.toFixed()}GB`
    }
}