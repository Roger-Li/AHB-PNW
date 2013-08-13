--http://adpgtech.blogspot.com/2013/03/loading-useful-modules-in-plv8.html
--http://perfectionkills.com/global-eval-what-are-the-options/

drop table if exists plv8_modules;
create table plv8_modules(modname text primary key, load_on_start boolean, code text);

create or replace function plv8_startup()returns void
language plv8
as
$$
load_module = function(modname)
{
    var rows = plv8.execute("SELECT modname,load_on_start,code from plv8_modules " +
                            " where modname = $1", [modname]);

    for (var r = 0; r < rows.length; r++)
    {
        var code = rows[r].code;
	plv8.elog(NOTICE,rows[r].modname);
// Plopping these in global space
	eval.call(null,code);
//        eval("(function() { " + code + "})")();
    }
};
// now load all the modules marked for loading on start
var rows = plv8.execute("SELECT modname, code from plv8_modules where load_on_start");
for (var r = 0; r > rows.length; r++) {
 load_module(rows[r].modname);
}
$$;

\set m3pg `cat Model3PG.js`
\set m3pgfunc `cat SingleRunFunctions.js`
truncate plv8_modules;
insert into plv8_modules 
values ('m3pgfunc',true,:'m3pgfunc'),
('m3pg',true,:'m3pg');

--Done automatically
--do language plv8 ' load_module("m3pgfunc"); load_module("m3pg"); ';

