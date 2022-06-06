import glob from 'glob'
import path from 'path
import { mergeAndDedupArrays, filterIgnoredFiles } from '../utils'
import { Config } from '../types'
import { getChangedFilesSinceRev } from '../git'

const removeDotSlash = (str: string): string => str.replace(/^\.\//, '')

const getFileList = async (
  config: Config,
  compare?: string,
  globOption?: string
): Promise<string[]> => {
  const includedGlob = !!globOption ? [globOption] : config.include
  
  if (!!compare) {
    return new Promise(async (resolve, reject) => {
      try {
        const changedFiles = await getChangedFilesSinceRev(compare)
        const ignoreDeletedfiles = changedFiles.filter(({ status }) => status === 'A' || status === 'M')
        const allChanges = ignoreDeletedfiles.map((item) => item.filePath)
        const files = filterIgnoredFiles(allChanges, config.exclude, includedGlob)
        
        resolve(files)
      } catch (error) {
        reject(error)
      }
    })
  }

  return new Promise((resolve, reject) => {
    try {
      const globOptions = { ignore: config.exclude, nodir: true }

      const filesFromSource = includedGlob.map(
        (globFilter) => glob.sync(globFilter, globOptions)
      )

      const files = mergeAndDedupArrays<string>(...filesFromSource).map(removeDotSlash)

      resolve(files)
    } catch (error) {
      reject(error)
    }
  })
}

export default getFileList