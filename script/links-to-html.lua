function Pandoc(doc)
  local prefix = nil
  if doc.meta["strip-prefix"] then
    prefix = pandoc.utils.stringify(doc.meta["strip-prefix"])
  end
  return doc:walk({
    Link = function(el)
      if prefix then
        el.target = el.target:gsub("^" .. prefix, "")
      end
      el.target = el.target:gsub("%.md$", "")
      return el
    end
  })
end
